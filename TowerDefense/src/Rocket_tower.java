import java.awt.*; 
import java.applet.Applet;   
import java.util.Random;
 
public class Rocket_tower extends Tower
{
	Missile[] missile;
	int maxMissile;
	
	public Rocket_tower(int x, int y, int d)
	{
		super(x,y,d);
		
		missile = new Missile[100];
		maxMissile = 0;
	}
	public Rocket_tower(Rocket_tower copy, int d)
	{
		super(copy,d);
		missile = new Missile[100];
		maxMissile = getM();
		
		for(int count=0; count < maxMissile; count ++)
		{
			missile[count] = new Missile(copy.missile[count],d);
		}
	}
	
	public int getM()
	{
		return maxMissile;
	}

	public int getDamage(int boost)
	{
		switch(damage+boost)
		{
			case 1:
				return 8;
			case 2:
				return 16;
			case 3:
				return 24;
			case 4:
				return 32;
			case 5:
				return 40;
			case 6:
				return 48;
			case 7:
				return 56;
			case 8:
				return 64;
		}
		return 0;
	}
	
	public int getRange(int boost)
	{
		switch(range+boost)
		{
			case 1:
				return 300;
			case 2:
				return 350;
			case 3:
				return 400;
			case 4:
				return 450;
			case 5:
				return 500;
			case 6:
				return 550;
			case 7:
				return 600;
			case 8:
				return 650;
		}
		return 0;
	}
	
	public int getRate(int boost)
	{
		switch(rate+boost)
		{
			case 1:
				return 50;
			case 2:
				return 47;
			case 3:
				return 44;
			case 4:
				return 41;
			case 5:
				return 38;
			case 6:
				return 35;
			case 7:
				return 32;
			case 8:
				return 29;		
		}
		return 0;
	}
	
	public int getUpD()
	{
		int num=0;
		
		if(damage < 5)
			for(int count=0; count < damage; count ++)
			{
				num += count+1;
			}
		
		return num*300;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*300;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*300;
	}
	
	public int getUpS()
	{
		int num=0;
		
		for(int count=0; count < rate; count ++)
		{
			num += count+1;
		}
		for(int count=0; count < range; count ++)
		{ 
			num += count+1;
		}
		for(int count=0; count < rate; count ++)
		{
			num += count+1;
		} 
		
		return num*300/3;
	}
	
	public void Attack(Creep[] creep, int enemies)
	{
		for(int count=0; count < enemies; count ++)
		{
			Random randy = new Random();
			if(creep[count].getV() && creep[count].getH() > 0)
			{
				double a = creep[count].getX()-getX();
			    double b = creep[count].getY()-getY();
			    double c = Math.hypot(a,b);
			    	
			    if(c <= (getRange(boostedR)/2)/diviser && reload == 0)
			    {
			    	reload += getRate(boostedT);
			    	target = count;
			    	if(b>0)
			    		angle = (int) Math.toDegrees(Math.asin(a/c));
			    	if(a>0)
			    		angle = (int) Math.toDegrees(Math.acos(b/c));
			    	else
			    		angle = (int) Math.toDegrees(Math.atan(a/b));
			    	double vector = angle * Math.PI*2 / 360.0;
			    	if(randy.nextInt(2) == 0)
			    		missile[maxMissile] = new Missile((int)(getX()-(30/diviser)*-b/c), (int)(getY()+(8/diviser)*a/c), target, diviser);
			    	else
			    		missile[maxMissile] = new Missile((int)(getX()+(30/diviser)*-b/c), (int)(getY()-(8/diviser)*a/c), target, diviser);
			    	maxMissile ++;
			    }

			    
			    if(c <= (getRange(boostedR)/2)/diviser && count == target)
			    {
			    	targetX = creep[count].getX();
			    	targetY = creep[count].getY();
			    }
			}
		}
		
			for(int count1=0; count1 < maxMissile; count1 ++)
		    {
		    	missile[count1].attack(creep[missile[count1].getTarget()]);
		    	
		    	if(missile[count1].explosion == 2)
		    	{
		    		for(int count2=0; count2 < enemies; count2 ++)
		    		{
		    			double a = creep[count2].getX()-missile[count1].getX();
				    	double b = creep[count2].getY()-missile[count1].getY();
				    	double c = Math.hypot(a,b);
				    	
					    if(c <= 100/diviser)
					    {
					    	creep[count2].takeDamage(getDamage(boostedD));
					    }
		    		}
		    	}
		    	if(missile[count1].explosion == 0)
		    	{
		    		for(int count3=count1; count3 < maxMissile-1; count3 ++)
		    		{
		    			missile[count3] = new Missile(missile[count3+1],diviser);
		    		}
		    		maxMissile --;
		    	}
		    }
		    
		if(reload > 0)
			reload --;
		else
			target = -1;
	}
	
	public void drawTower(Graphics g)
	{
    	//Rocket turret			
	   	double b = getX()-targetX;
		double a = getY()-targetY;
		double c = Math.hypot(a,b);
	      	
	   	Polygon part1 = new Polygon();
      	part1.addPoint((int)((getX()+(0/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(0/diviser)*a/c));
      	part1.addPoint((int)((getX()+(0/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(0/diviser)*a/c));
      	part1.addPoint((int)((getX()-(10/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)+(10/diviser)*a/c));
       	part1.addPoint((int)((getX()-(10/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)+(10/diviser)*a/c));
       	part1.addPoint((int)((getX()+(0/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(0/diviser)*a/c));
        	
       	Polygon part2 = new Polygon();
       	part2.addPoint((int)((getX()+(20/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(20/diviser)*a/c));
       	part2.addPoint((int)((getX()+(10/diviser)*-b/c)+(20/diviser)*a/c),(int)((getY()+(20/diviser)*-b/c)-(10/diviser)*a/c));
       	part2.addPoint((int)((getX()-(30/diviser)*-b/c)+(20/diviser)*a/c),(int)((getY()+(20/diviser)*-b/c)+(30/diviser)*a/c));
       	part2.addPoint((int)((getX()-(20/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)+(20/diviser)*a/c));
       	part2.addPoint((int)((getX()+(20/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(20/diviser)*a/c));
        	
       	Polygon part3 = new Polygon();
       	part3.addPoint((int)((getX()+(10/diviser)*-b/c)+(20/diviser)*a/c),(int)((getY()+(20/diviser)*-b/c)-(10/diviser)*a/c));
       	part3.addPoint((int)((getX()+(20/diviser)*-b/c)+(45/diviser)*a/c),(int)((getY()+(45/diviser)*-b/c)-(20/diviser)*a/c));
       	part3.addPoint((int)((getX()-(20/diviser)*-b/c)+(45/diviser)*a/c),(int)((getY()+(45/diviser)*-b/c)+(20/diviser)*a/c));
       	part3.addPoint((int)((getX()-(30/diviser)*-b/c)+(20/diviser)*a/c),(int)((getY()+(20/diviser)*-b/c)+(30/diviser)*a/c));
        part3.addPoint((int)((getX()+(10/diviser)*-b/c)+(20/diviser)*a/c),(int)((getY()+(20/diviser)*-b/c)-(10/diviser)*a/c));
        	
   		Polygon part4 = new Polygon();
   		part4.addPoint((int)((getX()+(20/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(20/diviser)*a/c));
       	part4.addPoint((int)((getX()+(30/diviser)*-b/c)+(35/diviser)*a/c),(int)((getY()+(35/diviser)*-b/c)-(30/diviser)*a/c));
       	part4.addPoint((int)((getX()+(20/diviser)*-b/c)+(45/diviser)*a/c),(int)((getY()+(45/diviser)*-b/c)-(20/diviser)*a/c));
       	part4.addPoint((int)((getX()+(10/diviser)*-b/c)+(20/diviser)*a/c),(int)((getY()+(20/diviser)*-b/c)-(10/diviser)*a/c));
       	part4.addPoint((int)((getX()+(20/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(20/diviser)*a/c));
       	
       	Polygon part5 = new Polygon();
       	part5.addPoint((int)((getX()+(20/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(20/diviser)*a/c));
       	part5.addPoint((int)((getX()+(10/diviser)*-b/c)-(20/diviser)*a/c),(int)((getY()-(20/diviser)*-b/c)-(10/diviser)*a/c));
       	part5.addPoint((int)((getX()-(30/diviser)*-b/c)-(20/diviser)*a/c),(int)((getY()-(20/diviser)*-b/c)+(30/diviser)*a/c));
       	part5.addPoint((int)((getX()-(20/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)+(20/diviser)*a/c));
       	part5.addPoint((int)((getX()+(20/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(20/diviser)*a/c));
        	
       	Polygon part6 = new Polygon();
       	part6.addPoint((int)((getX()+(10/diviser)*-b/c)-(20/diviser)*a/c),(int)((getY()-(20/diviser)*-b/c)-(10/diviser)*a/c));
       	part6.addPoint((int)((getX()+(20/diviser)*-b/c)-(45/diviser)*a/c),(int)((getY()-(45/diviser)*-b/c)-(20/diviser)*a/c));
       	part6.addPoint((int)((getX()-(20/diviser)*-b/c)-(45/diviser)*a/c),(int)((getY()-(45/diviser)*-b/c)+(20/diviser)*a/c));
       	part6.addPoint((int)((getX()-(30/diviser)*-b/c)-(20/diviser)*a/c),(int)((getY()-(20/diviser)*-b/c)+(30/diviser)*a/c));
       	part6.addPoint((int)((getX()+(10/diviser)*-b/c)-(20/diviser)*a/c),(int)((getY()-(20/diviser)*-b/c)-(10/diviser)*a/c));
       	
       	Polygon part7 = new Polygon();
       	part7.addPoint((int)((getX()+(20/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(20/diviser)*a/c));
       	part7.addPoint((int)((getX()+(30/diviser)*-b/c)-(35/diviser)*a/c),(int)((getY()-(35/diviser)*-b/c)-(30/diviser)*a/c));
       	part7.addPoint((int)((getX()+(20/diviser)*-b/c)-(45/diviser)*a/c),(int)((getY()-(45/diviser)*-b/c)-(20/diviser)*a/c));
        part7.addPoint((int)((getX()+(10/diviser)*-b/c)-(20/diviser)*a/c),(int)((getY()-(20/diviser)*-b/c)-(10/diviser)*a/c));
       	part7.addPoint((int)((getX()+(20/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(20/diviser)*a/c));
        		
       	g.setColor(Color.red);
		g.fillPolygon(part1);
		g.setColor(Color.white);
		g.drawPolygon(part1);
				
		g.setColor(Color.red);
		g.fillPolygon(part2);
		g.setColor(Color.white);
		g.drawPolygon(part2);
			
		g.setColor(Color.red);
		g.fillPolygon(part3);
		g.setColor(Color.white);
		g.drawPolygon(part3);
		
		g.setColor(Color.red);
		g.fillPolygon(part4);
		g.setColor(Color.white);
		g.drawPolygon(part4);
			
		g.setColor(Color.red);
		g.fillPolygon(part5);
		g.setColor(Color.white);
		g.drawPolygon(part5);
				
		g.setColor(Color.red);
		g.fillPolygon(part6);
		g.setColor(Color.white);
		g.drawPolygon(part6);
        		
     	g.setColor(Color.red);
		g.fillPolygon(part7);
		g.setColor(Color.white);
		g.drawPolygon(part7);
				
		g.setColor(Color.black);
        		
       	g.fillOval((int)((getX()+(19/diviser)*-b/c)+(18/diviser)*a/c)-(2/diviser),(int)((getY()+(18/diviser)*-b/c)-(20/diviser)*a/c)-(2/diviser),4/diviser,4/diviser);
       	g.fillOval((int)((getX()+(21/diviser)*-b/c)+(26/diviser)*a/c)-(2/diviser),(int)((getY()+(26/diviser)*-b/c)-(22/diviser)*a/c)-(2/diviser),4/diviser,4/diviser);
        g.fillOval((int)((getX()+(23/diviser)*-b/c)+(34/diviser)*a/c)-(2/diviser),(int)((getY()+(34/diviser)*-b/c)-(24/diviser)*a/c)-(2/diviser),4/diviser,4/diviser);
        		
       	g.fillOval((int)((getX()+(19/diviser)*-b/c)-(18/diviser)*a/c)-(2/diviser),(int)((getY()-(18/diviser)*-b/c)-(20/diviser)*a/c)-(2/diviser),4/diviser,4/diviser);
       	g.fillOval((int)((getX()+(21/diviser)*-b/c)-(26/diviser)*a/c)-(2/diviser),(int)((getY()-(26/diviser)*-b/c)-(22/diviser)*a/c)-(2/diviser),4/diviser,4/diviser);
       	g.fillOval((int)((getX()+(23/diviser)*-b/c)-(34/diviser)*a/c)-(2/diviser),(int)((getY()-(34/diviser)*-b/c)-(24/diviser)*a/c)-(2/diviser),4/diviser,4/diviser);		
       		
       	//missile////////
       	for(int count=0; count < maxMissile; count ++)
       	{
       		missile[count].drawMissile(g);
       	}
	}
}
