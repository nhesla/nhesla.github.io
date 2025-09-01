import java.awt.*;   

public class Autogun_tower extends Tower
{ 
	public Autogun_tower(int x, int y, int d)
	{
		super(x,y,d);
	}
	public Autogun_tower(Tower copy, int d)
	{
		super(copy,d);
	}
	
	public int getDamage(int boost)
	{
		switch(damage+boost)
		{
			case 1:
				return 3;
			case 2:
				return 6;
			case 3:
				return 9;
			case 4:
				return 12;
			case 5:
				return 15;
			case 6:
				return 18;
			case 7:
				return 21;
			case 8:
				return 24;
		}
		return 0;
	}
	
	public int getRange(int boost)
	{
		switch(range+boost)
		{
			case 1:
				return 200;
			case 2:
				return 250;
			case 3:
				return 300;
			case 4:
				return 350;
			case 5:
				return 400;
			case 6:
				return 450;
			case 7:
				return 500;
			case 8:
				return 550;
		}
		return 0;
	}
	
	public int getRate(int boost)
	{
		switch(rate+boost)
		{
			case 1:
				return 22;
			case 2:
				return 19;
			case 3:
				return 16;
			case 4:
				return 13;
			case 5:
				return 10;
			case 6:
				return 7;
			case 7:
				return 4;
			case 8:
				return 1;		
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
		
		return num*100;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*100;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*100;
	}
	public int getUpS()
	{
		int num=0;
		
		for(int count=0; count < damage; count ++)
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
		
		return num*100/3;
	}
	
	
	public void Attack(Creep[] creep, int enemies)
	{
		for(int count=0; count < enemies; count ++)
		{
			if(creep[count].getV())
			{
				double a = creep[count].getX()-getX();
			    double b = creep[count].getY()-getY();
			    double c = Math.hypot(a,b);
			    	
			    if(c <= (getRange(boostedR)/2)/diviser && reload == 0)
			    {
			    	reload += getRate(boostedT);
			    	target = count;
			    	creep[count].takeDamage(getDamage(boostedD));
			    }
			    
			    if(c <= (getRange(boostedR)/2)/diviser && count == target)
			    {
			    	targetX = creep[count].getX();
			    	targetY = creep[count].getY();
			    }
			}
		}
		
		if(reload > 0)
			reload --;
		else
			target = -1;
	}
	
	public void drawTower(Graphics g)
	{
	    /////Autogun turret///	
	    double b = getX()-targetX;
		double a = getY()-targetY;
		double c = Math.hypot(a,b);
	        	
	   	Polygon part1 = new Polygon();
      	part1.addPoint((int)((getX()+(10/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(10/diviser)*a/c));
       	part1.addPoint((int)((getX()+(10/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(10/diviser)*a/c));
       	part1.addPoint((int)((getX()+(5/diviser)*-b/c)-(15/diviser)*a/c),(int)((getY()-(15/diviser)*-b/c)-(5/diviser)*a/c));
       	part1.addPoint((int)((getX()-(10/diviser)*-b/c)-(15/diviser)*a/c),(int)((getY()-(15/diviser)*-b/c)+(10/diviser)*a/c));
       	part1.addPoint((int)((getX()-(15/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)+(15/diviser)*a/c));
       	part1.addPoint((int)((getX()-(15/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)+(15/diviser)*a/c));
       	part1.addPoint((int)((getX()-(10/diviser)*-b/c)+(15/diviser)*a/c),(int)((getY()+(15/diviser)*-b/c)+(10/diviser)*a/c));
       	part1.addPoint((int)((getX()+(5/diviser)*-b/c)+(15/diviser)*a/c),(int)((getY()+(15/diviser)*-b/c)-(5/diviser)*a/c));
       	part1.addPoint((int)((getX()+(10/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(10/diviser)*a/c));
       	
	  	Polygon part2 = new Polygon();
       	part2.addPoint((int)((getX()+(40/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(40/diviser)*a/c));
       	part2.addPoint((int)((getX()+(35/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(35/diviser)*a/c));
       	part2.addPoint((int)((getX()+(35/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(35/diviser)*a/c));
       	part2.addPoint((int)((getX()+(40/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(40/diviser)*a/c));
       	part2.addPoint((int)((getX()+(40/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(40/diviser)*a/c));
       	
       	Polygon part3 = new Polygon();
       	part3.addPoint((int)((getX()+(35/diviser)*-b/c)+(8/diviser)*a/c),(int)((getY()+(8/diviser)*-b/c)-(35/diviser)*a/c));
       	part3.addPoint((int)((getX()+(35/diviser)*-b/c)-(8/diviser)*a/c),(int)((getY()-(8/diviser)*-b/c)-(35/diviser)*a/c));
       	part3.addPoint((int)((getX()+(10/diviser)*-b/c)-(8/diviser)*a/c),(int)((getY()-(8/diviser)*-b/c)-(10/diviser)*a/c));
       	part3.addPoint((int)((getX()+(10/diviser)*-b/c)+(8/diviser)*a/c),(int)((getY()+(8/diviser)*-b/c)-(10/diviser)*a/c));
        part3.addPoint((int)((getX()+(35/diviser)*-b/c)+(8/diviser)*a/c),(int)((getY()+(8/diviser)*-b/c)-(35/diviser)*a/c));
        		
       	g.setColor(Color.green);
		g.fillPolygon(part1);
		g.setColor(Color.white);
		g.drawPolygon(part1);
					
		g.setColor(Color.green);
		g.fillPolygon(part2);
		g.setColor(Color.white);
		g.drawPolygon(part2);
				
		g.setColor(Color.gray);
		g.fillPolygon(part3);
		g.setColor(Color.white);
		g.drawPolygon(part3);
        	
       	if(reload % 2 == 0)
       	{
       		Polygon part4 = new Polygon();
       		part4.addPoint((int)((getX()+(35/diviser)*-b/c)+(3/diviser)*a/c),(int)((getY()+(3/diviser)*-b/c)-(35/diviser)*a/c));
       		part4.addPoint((int)((getX()+(35/diviser)*-b/c)-(3/diviser)*a/c),(int)((getY()-(3/diviser)*-b/c)-(35/diviser)*a/c));
       		part4.addPoint((int)((getX()+(10/diviser)*-b/c)-(3/diviser)*a/c),(int)((getY()-(3/diviser)*-b/c)-(10/diviser)*a/c));
       		part4.addPoint((int)((getX()+(10/diviser)*-b/c)+(3/diviser)*a/c),(int)((getY()+(3/diviser)*-b/c)-(10/diviser)*a/c));
       		part4.addPoint((int)((getX()+(35/diviser)*-b/c)+(3/diviser)*a/c),(int)((getY()+(3/diviser)*-b/c)-(35/diviser)*a/c));
			
			g.setColor(Color.green);
			g.fillPolygon(part4);
			g.setColor(Color.white);
			g.drawPolygon(part4);
       	}
       	else
       	{
       		Polygon part4 = new Polygon();
       		part4.addPoint((int)((getX()+(35/diviser)*-b/c)+(8/diviser)*a/c),(int)((getY()+(8/diviser)*-b/c)-(35/diviser)*a/c));
       		part4.addPoint((int)((getX()+(35/diviser)*-b/c)+(2/diviser)*a/c),(int)((getY()+(2/diviser)*-b/c)-(35/diviser)*a/c));
       		part4.addPoint((int)((getX()+(10/diviser)*-b/c)+(2/diviser)*a/c),(int)((getY()+(2/diviser)*-b/c)-(10/diviser)*a/c));
       		part4.addPoint((int)((getX()+(10/diviser)*-b/c)+(8/diviser)*a/c),(int)((getY()+(8/diviser)*-b/c)-(10/diviser)*a/c));
       		part4.addPoint((int)((getX()+(35/diviser)*-b/c)+(8/diviser)*a/c),(int)((getY()+(8/diviser)*-b/c)-(35/diviser)*a/c));
        		
       		Polygon part5 = new Polygon();
       		part5.addPoint((int)((getX()+(35/diviser)*-b/c)-(8/diviser)*a/c),(int)((getY()-(8/diviser)*-b/c)-(35/diviser)*a/c));
       		part5.addPoint((int)((getX()+(35/diviser)*-b/c)-(2/diviser)*a/c),(int)((getY()-(2/diviser)*-b/c)-(35/diviser)*a/c));
       		part5.addPoint((int)((getX()+(10/diviser)*-b/c)-(2/diviser)*a/c),(int)((getY()-(2/diviser)*-b/c)-(10/diviser)*a/c));
       		part5.addPoint((int)((getX()+(10/diviser)*-b/c)-(8/diviser)*a/c),(int)((getY()-(8/diviser)*-b/c)-(10/diviser)*a/c));
       		part5.addPoint((int)((getX()+(35/diviser)*-b/c)-(8/diviser)*a/c),(int)((getY()-(8/diviser)*-b/c)-(35/diviser)*a/c));
			
			g.setColor(Color.green);
			g.fillPolygon(part4);
			g.setColor(Color.white);
			g.drawPolygon(part4);
			
			g.setColor(Color.green);
			g.fillPolygon(part5);
			g.setColor(Color.white);
			g.drawPolygon(part5);
       	}
       	
       	if(reload >= getRate(0)-3)
       	{
       		//////////gun flare/////////////
			/*g.setColor(Color.yellow);
			g.fillArc((int)(((getX()-25/diviser)+(70/diviser)*-b/c)-(0/diviser)*a/c),(int)(((getY()-25/diviser)-(0/diviser)*-b/c)-(70/diviser)*a/c),(50/diviser),(50/diviser),240-angle,60);
				
			g.setColor(Color.orange);
			g.fillArc((int)(((getX()-15/diviser)+(60/diviser)*-b/c)-(0/diviser)*a/c),(int)(((getY()-15/diviser)-(0/diviser)*-b/c)-(60/diviser)*a/c),(30/diviser),(30/diviser),240-angle,60);
			/* */

			int arcAngle = 60; // arc width in degrees
			int startAngle = (int)(angle - arcAngle / 2);

			g.setColor(Color.yellow);
			g.fillArc(
				(int)(((getX() - 25/diviser) + (70/diviser) * -b/c) - (0/diviser) * a/c),
				(int)(((getY() - 25/diviser) - (0/diviser) * -b/c) - (70/diviser) * a/c),
				(50/diviser),
				(50/diviser),
				startAngle,
				arcAngle
			);

			g.setColor(Color.orange);
			g.fillArc(
				(int)(((getX() - 15/diviser) + (60/diviser) * -b/c) - (0/diviser) * a/c),
				(int)(((getY() - 15/diviser) - (0/diviser) * -b/c) - (60/diviser) * a/c),
				(30/diviser),
				(30/diviser),
				startAngle,
				arcAngle
			);
		}
	}
}