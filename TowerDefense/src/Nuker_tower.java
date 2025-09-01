import java.awt.*;  
import java.applet.Applet;  
import java.util.Random;
 
public class Nuker_tower extends Tower
{
	public Nuker_tower(int x, int y, int d)
	{
		super(x,y,d);
	}
	public Nuker_tower(Tower copy, int d)
	{
		super(copy,d);
	}
	
	public int getDamage(int boost)
	{
		switch(damage+boost)
		{
			case 1:
				return 7;
			case 2:
				return 14;
			case 3:
				return 21;
			case 4:
				return 28;
			case 5:
				return 35;
			case 6:
				return 42;
			case 7:
				return 48;
			case 8:
				return 56;
		}
		return 0;
	}
	
	public int getRange(int boost)
	{
		switch(range+boost)
		{
			case 1:
				return 150;
			case 2:
				return 200;
			case 3:
				return 250;
			case 4:
				return 300;
			case 5:
				return 350;
			case 6:
				return 400;
			case 7:
				return 450;
			case 8:
				return 500;
		}
		return 0;
	}
	
	public int getRate(int boost)
	{
		switch(rate+boost)
		{
			case 1:
				return 30;
			case 2:
				return 27;
			case 3:
				return 24;
			case 4:
				return 21;
			case 5:
				return 18;
			case 6:
				return 15;
			case 7:
				return 12;
			case 8:
				return 9;		
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
		
		return num*700;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*700;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*700;
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
		
		return num*700/3;
	}
	
	public void Attack(Creep[] creep, int enemies)
	{
		for(int count=0; count < enemies; count ++)
		{
			if(creep[count].getV() && creep[count].getH() > 0)
			{
				double a = creep[count].getX()-getX();
			    double b = creep[count].getY()-getY();
			    double c = Math.hypot(a,b);
			    	
			    if(c <= (getRange(boostedR)/2)/diviser && reload == 0)
			    {
			    	reload += getRate(boostedT);
			    	target = count;
			    	
			    	for(int count2=0; count2 < enemies; count2 ++)
			    	{
			    		a = creep[count2].getX()-getX();
			    		b = creep[count2].getY()-getY();
			    		c = Math.hypot(a,b);
					    	
					    if(c <= (getRange(boostedR)/2)/diviser)
					    {
					    	creep[count2].takeDamage(getDamage(boostedD));
					    }
			    	}
			    }
			    
			    if(c <= (getRange(boostedR)/2)/diviser && count == target)
			    {
			    	targetX = creep[count].getX();
			    	targetY = creep[count].getY();
			    	angle = (int) Math.toDegrees(a/c);
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
		////////Nuker tower/////////
		Polygon part1 = new Polygon();
		part1.addPoint(getX()-(7/diviser),getY()+(10/diviser));
		part1.addPoint(getX()-(3/diviser),getY()+(3/diviser));
		part1.addPoint(getX()+(3/diviser),getY()+(3/diviser));
		part1.addPoint(getX()+(8/diviser),getY()+(10/diviser));
		part1.addPoint(getX()+(13/diviser),getY()+(0/diviser));
		part1.addPoint(getX()+(5/diviser),getY()+(0/diviser));
		part1.addPoint(getX()+(3/diviser),getY()-(3/diviser));
		part1.addPoint(getX()+(7/diviser),getY()-(12/diviser));
		part1.addPoint(getX()-(7/diviser),getY()-(12/diviser));
		part1.addPoint(getX()-(3/diviser),getY()-(3/diviser));
		part1.addPoint(getX()-(5/diviser),getY()+(0/diviser));
		part1.addPoint(getX()-(13/diviser),getY()+(0/diviser));
		part1.addPoint(getX()-(7/diviser),getY()+(10/diviser));
		
		Polygon part2 = new Polygon();
		part2.addPoint(getX()-(7/diviser),getY()+(10/diviser));
		part2.addPoint(getX()+(7/diviser),getY()+(10/diviser));
		part2.addPoint(getX()+(3/diviser),getY()+(3/diviser));
		part2.addPoint(getX()+(5/diviser),getY()+(0/diviser));
		part2.addPoint(getX()+(13/diviser),getY()+(0/diviser));
		part2.addPoint(getX()+(7/diviser),getY()-(12/diviser));
		part2.addPoint(getX()+(3/diviser),getY()-(3/diviser));
		part2.addPoint(getX()-(3/diviser),getY()-(3/diviser));
		part2.addPoint(getX()-(7/diviser),getY()-(12/diviser));
		part2.addPoint(getX()-(13/diviser),getY()+(0/diviser));
		part2.addPoint(getX()-(5/diviser),getY()+(0/diviser));
		part2.addPoint(getX()-(3/diviser),getY()+(3/diviser));
		part2.addPoint(getX()-(7/diviser),getY()+(10/diviser));
		
		if(reload % 2 == 0)
		{
			g.setColor(Color.black);
			g.fillPolygon(part1);
			g.setColor(Color.yellow);
			g.fillPolygon(part2);
		}
		else
		{
			g.setColor(Color.black);
			g.fillPolygon(part2);
			g.setColor(Color.yellow);
			g.fillPolygon(part1);
		}
		
		
		////////////Nuker wave////////
		
		g.setColor(Color.white);
		if(reload == getRate(boostedT)-1)
		{
			for(int count=0; count < 10; count ++)
			{
				g.setColor(new Color(255-(count*2), 125-(count), 0));
				g.drawOval((int)getX()-(((getRange(boostedR)/3)-count*5)/diviser),(int)getY()-(((getRange(boostedR)/3)-count*5)/diviser),(int)(((getRange(boostedR)*2/3)-count*10)/diviser),(int)(((getRange(boostedR)*2/3)-count*10)/diviser));
			}
		}
		
		if(reload == getRate(boostedT)-2)
		{
			for(int count=0; count < 10; count ++)
			{
				g.setColor(new Color(255-(count*2), 125-(count), 0));
				g.drawOval((int)getX()-(((getRange(boostedR)/2)-count*5)/diviser),(int)getY()-(((getRange(boostedR)/2)-count*5)/diviser),(int)((getRange(boostedR)-count*10)/diviser),(int)((getRange(boostedR)-count*10)/diviser));
			}
		}
	}
}